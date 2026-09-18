// Résolution d'une référence du bestiaire vers sa question (2026-09-17). PUR, mais LOURD : il importe
// les banques de questions (grammar, listening, part6, part7, et depuis le 2026-09-18 celles du Gauntlet,
// des jeux et des mini-modules). À charger À LA DEMANDE — `lib/review.js`
// reste sans données pour que le Mentor et App() ne tirent pas listening.js dans le bundle principal.
//
// Ce que ça garantit : la référence désigne l'ITEM, jamais une option. Toutes les questions sont
// REPERMUTÉES à chaque résolution — l'élève ne réapprend pas « c'était B ». Écoute : shufListeningItem,
// l'explication suit la permutation et la lettre entendue reste celle de la position affichée (`aud`).
// Grammaire, Part 6, Part 7 et modules : `perm` (aucune de leurs explications ne cite de lettre).
import { QUESTIONS, WORD_FAMILIES } from "../data/grammar.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../data/listening.js";
import { PART6_TEXTS } from "../data/part6.js";
import { PART7_PASSAGES } from "../data/part7.js";
import { IRREGULAR_VERBS, TENSE_CHRONOMANCER, PASSIVE_FORGE, RELATIVE_WEAVER } from "../data/grammarGauntlet.js";
import { CLUE_HUNTER } from "../data/clueHunter.js";
import { AUDIO_BLITZ } from "../data/audioBlitz.js";
import { VOCAB } from "../data/vocab.js";
import { MIMIC_ITEMS } from "../data/mimicHunt.js";
import { MODAL_MATCH_BOARDS, MODAL_SORT_ITEMS } from "../data/modals.js";
import { CONNECTORS, CONNECTOR_RULES, PREP_COLLOCATIONS, GERUND_INF, TOEIC_TRAPS, STRAT_QUIZ, FALSE_FRIENDS } from "../data/miniGames.js";
import { LINKING_BRIDGE } from "../data/linkingBridge.js";
import { PHRASAL_VERBS } from "../data/phrasalVerbs.js";
import { shufListeningItem } from "./listeningShuffle.js";
import { refParts } from "./review.js";
import { moduleRef } from "./reviewRefs.js";
import { shuffle } from "./util.js";

// Modules qui puisent dans la banque de grammaire : une erreur de Drill peut revenir par la chasse,
// même si elle a été commise dans le Daily Challenge ou l'Exam Simulation.
var GRAMMAR_MODS = { drill: 1, daily: 1, timesim: 1, game_wordFall: 1 };
var byId = function (arr, id) { return arr.find(function (x) { return x.id === id; }); };

// Rend null si la référence ne peut pas être reposée (module pas encore couvert, contenu supprimé) :
// l'appelant saute la créature, il ne plante pas.
export function lookupRef(k) {
  var r = refParts(k), qi = r.sub === null ? null : parseInt(r.sub, 10);
  if (MODULE_MODS[r.mod]) return lookupModule(k, r);
  if (GRAMMAR_MODS[r.mod]) {
    var q = byId(QUESTIONS, r.id);
    if (!q) return null;
    var pm = perm(q.o, q.c);
    return { k: k, mod: r.mod, kind: "text", part: "p5", cat: q.cat, label: q.cat,
      prompt: q.s, options: pm.options, c: pm.c, why: q.x };
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
    var txt = p6Text(t6, qi), pb = perm(b.options, b.correct);
    return { k: k, mod: r.mod, kind: "passage", part: "p6", label: "Part 6 — " + t6.type,
      // `title` : l'extrait autour du trou, pour reconnaître la créature dans le bestiaire.
      title: aroundBlank(txt),
      // Pas de « blank 3 » : les autres trous sont rendus remplis, il n'en reste qu'un à l'écran.
      prompt: "Choose the best option to fill the blank.", options: pb.options, c: pb.c, why: b.x,
      passage: { id: t6.id, type: t6.type, text: txt } };
  }
  if (r.mod === "p7") {
    var ps = byId(PART7_PASSAGES, r.id), pq = ps && ps.questions[qi];
    if (!pq) return null;
    var p7m = perm(pq.options, pq.correct);
    return { k: k, mod: r.mod, kind: "passage", part: "p7", label: "Part 7 — " + ps.type,
      prompt: pq.q, options: p7m.options, c: p7m.c, why: pq.x,
      passage: { id: ps.id, type: ps.type, text: ps.text } };
  }
  return null;
}
// ── Les autres modules (2026-09-18) ──
// Tout revient en QCM, le seul format que la chasse rend. La catégorie vient de lib/reviewRefs.js, la
// table que le module a lue à la capture. Les options sont PERMUTÉES à chaque résolution : ces banques
// placent la bonne réponse en B ou C huit fois sur dix, et aucune explication ne cite de lettre. Seules
// les grilles de catégories (natures de mots, règles des connecteurs, fonctions des modaux) gardent
// l'ordre du module. Les distracteurs que le module GÉNÈRE (Word Tavern, Phrasal Dojo, Prepositions)
// sont regénérés ici : la référence désigne l'item, pas les options tirées ce jour-là.
// Hors bestiaire : Sentence Builder (des blocs à ordonner, pas un QCM), l'indice du Clue Hunter (des mots
// à cocher), le Mimic manqué de Mimic Hunt, les mots à deux natures de Word Families, Speed Match.
var MODULE_MODS = { gauntlet: 1, clue: 1, ablitz: 1, tavern: 1, mimic: 1, modals_match: 1, modals_sort: 1, wordfam: 1, connsort: 1, bforge: 1, prepdrill: 1, gerinf: 1, traps: 1, stratquiz: 1, falsefr: 1, pvdojo: 1 };
var GAUNTLET = { irr: ["Irregular Crypt", IRREGULAR_VERBS], td: ["Chronomancer", TENSE_CHRONOMANCER], pf: ["Passive Forge", PASSIVE_FORGE], rw: ["Relative Weaver", RELATIVE_WEAVER] };
// Même ordre que la grille du module (features/train/grammar.jsx WordFam).
var POS = ["Noun", "Verb", "Adjective", "Adverb"], POS_KEY = { Verb: "v", Noun: "n", Adjective: "adj", Adverb: "adv" };
var BUCKETS = ["obligation", "advice", "possibility", "deduction"];
function perm(options, c) {
  var order = shuffle(options.map(function (o, i) { return i; }));
  return { options: order.map(function (i) { return options[i]; }), c: order.indexOf(c) };
}
// Bonne réponse + 3 distracteurs distincts au plus, permutés.
function mcq(correct, distractors) {
  var d = distractors.filter(function (x, i, a) { return x && x !== correct && a.indexOf(x) === i; }).slice(0, 3);
  return perm([correct].concat(d), 0);
}
// Le prétérit « régulier » qu'un élève invente (drived, buyed) : le premier piège d'un verbe irrégulier.
function regular(base) { return /e$/.test(base) ? base + "d" : /[^aeiou]y$/.test(base) ? base.slice(0, -1) + "ied" : base + "ed"; }
function lookupModule(k, r) {
  var ref = function (label) { return moduleRef(r.mod, r.id, r.sub, label); };
  var q = function (label, prompt, m, why, extra) {
    var rf = extra && extra.refLabel !== undefined ? ref(extra.refLabel) : ref();
    var out = { k: k, mod: r.mod, kind: "text", part: rf.part, cat: rf.cat, label: label, prompt: prompt, options: m.options, c: m.c, why: why || "" };
    if (extra) Object.keys(extra).forEach(function (x) { if (x !== "refLabel") out[x] = extra[x]; });
    return out;
  };
  var it, m;
  if (r.mod === "gauntlet") {
    var g = GAUNTLET[String(r.id).replace(/\d+$/, "")];
    it = g && byId(g[1], r.id);
    if (!it) return null;
    var lbl = "Grammar Gauntlet · " + g[0];
    if (it.base) {
      // Tapé dans le module, reposé en QCM sur les confusions qui comptent : prétérit régulier inventé,
      // prétérit et participe inversés ou confondus.
      var rg = regular(it.base), pair = function (a, b) { return a + " · " + b; };
      m = mcq(pair(it.past, it.pp), [pair(rg, rg), pair(it.pp, it.past), pair(it.past, it.past), pair(it.pp, it.pp),
        pair(it.base, it.pp), pair(rg, it.pp), pair(it.past, rg), pair(it.base, it.base)]);
      return q(lbl, "Past simple · past participle of “" + it.base + "”?", m, it.fr + (it.ex ? " — " + it.ex : ""));
    }
    if (it.prompt) return q(lbl, (it.active ? "“" + it.active + "” → " : "") + it.prompt, perm(it.o, it.c), it.x);
    return q(lbl, it.s, perm(it.o, it.c), it.x);
  }
  if (r.mod === "clue") {
    it = byId(CLUE_HUNTER, r.id);
    // Le libellé fin (« Gerund after 'avoid' ») dirait la réponse : il ne sert qu'à la catégorie.
    return it ? q("Clue Hunter", it.sentence.replace(/_{3,}/, "_____"), perm(it.opts, it.ans), it.exp, { refLabel: it.cat }) : null;
  }
  if (r.mod === "ablitz") {
    it = byId(AUDIO_BLITZ, r.id);
    // Comme dans le module : la question se lit avant l'écoute, on ne répond qu'après.
    return it ? q("Audio Blitz", it.q, perm(it.opts, it.c), "Transcript: “" + it.text + "”", { kind: "audio", audio: { kind: "blitz", id: it.id } }) : null;
  }
  if (r.mod === "tavern") {
    var dom = VOCAB.find(function (d) { return d.cards.some(function (c) { return c.id === r.id; }); });
    var card = dom && dom.cards.find(function (c) { return c.id === r.id; });
    if (!card) return null;
    // Distracteurs du même domaine, comme le module.
    var others = shuffle(dom.cards.filter(function (c) { return c.id !== card.id; }));
    if (r.sub === "wordToDef") return q("Word Tavern · word → meaning", "What does “" + card.w + "” mean?", mcq(card.d, others.map(function (o) { return o.d; })), "“" + card.e + "”");
    m = mcq(card.w, others.map(function (o) { return o.w; }));
    var blank = new RegExp("\\b" + card.w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (r.sub === "fillBlank" && blank.test(card.e)) return q("Word Tavern · fill the blank", card.e.replace(blank, "_____"), m, card.d);
    return q("Word Tavern · definition → word", "Which word means: “" + card.d + "”?", m, "“" + card.e + "”");
  }
  if (r.mod === "mimic") {
    it = byId(MIMIC_ITEMS, r.id);
    return it ? q("Mimic Hunt · " + it.ctx, it.q, perm(it.opts, it.c), it.exp,
      { kind: "passage", passage: { id: it.id, type: it.ctx, text: it.src } }) : null;
  }
  if (r.mod === "modals_match") {
    var board = byId(MODAL_MATCH_BOARDS, r.id), pr = board && board.pairs[parseInt(r.sub, 10)];
    if (!pr) return null;
    // Les autres réponses du même plateau : c'est entre elles que l'élève s'est trompé.
    return q("Modal Council · " + board.theme, pr.situation + " What do you say?",
      mcq(pr.modal, board.pairs.map(function (x) { return x.modal; })), "");
  }
  if (r.mod === "modals_sort") {
    it = byId(MODAL_SORT_ITEMS, r.id);
    if (!it || BUCKETS.indexOf(it.bucket) < 0) return null;
    return q("Modal Council · " + it.modal, "“" + it.s + "” — what does “" + it.modal + "” express here?",
      { options: BUCKETS.map(function (b) { return b.charAt(0).toUpperCase() + b.slice(1); }), c: BUCKETS.indexOf(it.bucket) }, it.x);
  }
  if (r.mod === "wordfam") {
    var key = POS_KEY[r.sub], w = String(r.id).toLowerCase();
    var fam = key && WORD_FAMILIES.find(function (f) { return f[key] && f[key].toLowerCase() === w; });
    if (!fam) return null;
    return q("Word Families", "Is “" + r.id + "” a noun, a verb, an adjective or an adverb?", { options: POS, c: POS.indexOf(r.sub) },
      [fam.v && "Verb: " + fam.v, fam.n && "Noun: " + fam.n, fam.adj && "Adjective: " + fam.adj, fam.adv && "Adverb: " + fam.adv].filter(Boolean).join(" · "));
  }
  if (r.mod === "connsort") {
    it = CONNECTORS.find(function (x) { return x.word === r.id; });
    var rules = CONNECTOR_RULES.map(function (x) { return x.id; });
    if (!it || rules.indexOf(it.rule) < 0) return null;
    return q("Connectors", "What comes after “" + it.word + "”?", { options: CONNECTOR_RULES.map(function (x) { return x.label + " (" + x.desc + ")"; }), c: rules.indexOf(it.rule) },
      it.tip + (it.ex ? " — “" + it.ex + "”" : ""));
  }
  if (r.mod === "bforge") {
    it = byId(LINKING_BRIDGE, r.id);
    var good = it && it.opts.findIndex(function (o) { return o.correct; });
    return it && good >= 0 ? q("Linking Bridge", it.prompt, perm(it.opts.map(function (o) { return o.w; }), good), it.exp) : null;
  }
  if (r.mod === "prepdrill") {
    it = PREP_COLLOCATIONS.find(function (x) { return x.base === r.id; });
    if (!it) return null;
    // Jamais une préposition que le module accepte aussi (alts) en distracteur.
    var ok = [it.prep].concat(it.alts || []);
    return q("Prepositions", it.base + " _____", mcq(it.prep, shuffle(PREP_COLLOCATIONS.map(function (x) { return x.prep; }).filter(function (x) { return ok.indexOf(x) < 0; }))), it.ex);
  }
  if (r.mod === "gerinf") {
    it = GERUND_INF.find(function (x) { return x.verb === r.id; });
    return it ? q("Gerund or infinitive · " + it.verb, it.ctx, perm(it.opts, it.c), it.tip + (it.ex ? " — “" + it.ex + "”" : "")) : null;
  }
  if (r.mod === "traps") {
    it = TOEIC_TRAPS.find(function (x) { return String(x.id) === String(r.id); });
    return it ? q("Traps Quiz · " + it.part, it.scenario, perm(it.options, it.correct), it.tip) : null;
  }
  if (r.mod === "stratquiz") {
    it = byId(STRAT_QUIZ, r.id);
    return it ? q("Strategy · " + it.part, it.scenario, perm(it.options, it.correct), it.explain) : null;
  }
  if (r.mod === "falsefr") {
    it = FALSE_FRIENDS.find(function (x) { return x.en === r.id; });
    return it ? q("False friend · " + it.en, "“" + it.ex + "” — what does “" + it.en + "” mean here?", perm(it.opts, it.correct),
      it.trap + (it.realFr ? " (FR: " + it.realFr + ")" : "")) : null;
  }
  if (r.mod === "pvdojo") {
    it = PHRASAL_VERBS.find(function (x) { return x.pv === r.id; });
    if (!it) return null;
    var rest = shuffle(PHRASAL_VERBS.filter(function (x) { return x.pv !== it.pv; }));
    if (r.sub === "picker") {
      return q("Phrasal verbs · particle", it.v + " _____ = " + it.m, mcq(it.p, rest.map(function (x) { return x.p; })),
        it.pv + (it.fr ? " — " + it.fr : "") + (it.ex ? " · “" + it.ex + "”" : ""));
    }
    return q("Phrasal verbs · meaning", "What does “" + it.pv + "” mean?", mcq(it.m, rest.map(function (x) { return x.m; })), (it.fr ? it.fr + " — " : "") + "“" + it.ex + "”");
  }
  return null;
}
// L'extrait autour du trou, coupé aux mots entiers (« …er commercial rents » ne se lisait pas).
export function aroundBlank(txt) {
  var at = txt.indexOf("_____"), a = Math.max(0, at - 50), z = Math.min(txt.length, at + 35);
  var before = txt.slice(a, at).replace(/\s+/g, " "), after = txt.slice(at + 5, z).replace(/\s+/g, " ");
  if (a > 0) before = before.replace(/^\S*\s/, "");
  if (z < txt.length) after = after.replace(/\s\S*$/, "");
  return (a > 0 ? "…" : "") + before.trimStart() + "_____" + after.trimEnd() + (z < txt.length ? "…" : "");
}
// Coupe à `n` caractères au plus, sur un mot entier.
function clip(s, n) {
  s = String(s).replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  var cut = s.slice(0, n), sp = cut.lastIndexOf(" ");
  return (sp > n / 2 ? cut.slice(0, sp) : cut).replace(/[\s,.;:—–-]+$/, "") + "…";
}
// Le titre d'un passage Part 7 : l'objet d'un email, sinon la première ligne qui n'est ni un en-tête
// (From, To, Date, Dear…) ni un séparateur ni le seul mot MEMO.
function headline(text) {
  var m = String(text).match(/^Subject:\s*(.+)$/m);
  if (m) return m[1];
  var lines = String(text).split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  return lines.find(function (l) { return !/^(From|To|Date|Dear|Re|Cc|Sent)\b|^-{2,}|^(MEMO|MEMORANDUM|NOTICE)$/i.test(l); }) || null;
}
// Nom court d'un document, pour distinguer dans le Lair deux groupes du même type (deux « Part 6 ·
// Article » pour deux textes différents). Un sujet, un titre ou une première réplique : jamais la réponse.
function docName(r) {
  var d;
  if (r.mod === "p6") { d = byId(PART6_TEXTS, r.id); return d && d.subject ? clip(d.subject, 44) : null; }
  if (r.mod === "p7") { d = byId(PART7_PASSAGES, r.id); var h = d && headline(d.text); return h ? clip(h, 44) : null; }
  if (r.mod === "lisP3") { d = byId(LISTENING_P3, r.id); return d && d.lines && d.lines[0] ? "“" + clip(d.lines[0].t, 32) + "”" : null; }
  if (r.mod === "lisP4") { d = byId(LISTENING_P4, r.id); return d && d.text ? "“" + clip(skipGreeting(d.text), 32) + "”" : null; }
  return null;
}
// « Good morning, everyone. » ouvre la moitié des exposés de Part 4 : le nom commence après.
function skipGreeting(t) {
  var rest = String(t).replace(/^\s*(good (morning|afternoon|evening)|hello|hi|welcome|attention)\b[^.!?]*[.!?]\s+/i, "");
  return rest.length > 20 ? rest : t;
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
    var name = docName(r);
    return part + (doc && doc.type ? " · " + doc.type : "") + (name ? " — " + name : "");
  }
  var p = g.part || "";
  return { p1: "Part 1", p2: "Part 2", p3: "Part 3", p4: "Part 4", p5: "Grammar", p6: "Part 6", p7: "Part 7" }[p] || "Other";
}
