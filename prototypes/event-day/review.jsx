// Relecture du vivier « événements » (sans React : une liste à cocher). Textes lus dans les vraies banques.
import { LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";
import CANDIDATES from "./candidates.json";

// Présélection de Claude : organiser (lieu, traiteur, stand de salon, matériel, programme, invités) ou y être (ouverture,
// remise de prix, consignes d'un atelier).
var KEEP = { p3_75: 1, p3_69: 1, p3_01: 1, p3_58: 1, p3_84: 1, p3_77: 1, p3_60: 1, p3_26: 1, p3_64: 1, p3_94: 1, p3_39: 1, p3_47: 1, p3_90: 1, p3_45: 1, p3_88: 1,
  p4_78: 1, p4_20: 1, p4_30: 1, p4_61: 1, p4_71: 1, p4_82: 1, p4_14: 1, p4_58: 1, p4_68: 1, p4_75: 1, p4_90: 1,
  p7p24: 1, p7p34: 1, p7p62: 1, p7p8: 1, p7p38: 1, p7p4: 1, p7p69: 1, p7p44: 1, p7p49: 1 };
// Variante E2 : le déroulé à lire le matin, et les pépins de dernière minute.
var PREP = { p7p8: 1, p7p24: 1, p7p62: 1, p4_14: 1, p4_58: 1 };
var HITCH = { p3_39: 1, p3_94: 1, p7p34: 1, p7p69: 1 };
// Variante E1 : l'ouverture de la soirée (en fin de journée).
var FINALE = { p4_20: 1, p4_30: 1, p4_78: 1, p4_61: 1, p4_71: 1, p4_82: 1, p4_68: 1, p4_75: 1 };
// Déjà pris par un autre monde : pas cochés ici.
var TAKEN = { p3_63: "Front Desk", p7p75: "Jet Lag", p4_88: "Front Desk" };
var sel = Object.assign({}, KEEP);

function item(c) {
  if (c.part === "P3") { var a = LISTENING_P3.find(function (x) { return x.id === c.id; }); return { text: a.lines.map(function (l) { return l.s + ": " + l.t; }).join("\n"), qs: a.qs.map(function (q) { return { q: q.q, a: q.opts[q.c] }; }) }; }
  if (c.part === "P4") { var b = LISTENING_P4.find(function (x) { return x.id === c.id; }); return { text: b.text, qs: b.qs.map(function (q) { return { q: q.q, a: q.opts[q.c] }; }) }; }
  var d = PART7_PASSAGES.find(function (x) { return x.id === c.id; }); return { text: d.text, qs: (d.questions || []).map(function (q) { return { q: q.q, a: q.options[q.correct] }; }) };
}
function esc(s) { return String(s).replace(/[&<>]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]; }); }

function render() {
  var list = document.getElementById("list");
  list.innerHTML = "";
  ["P3", "P4", "P7"].forEach(function (part) {
    var h = document.createElement("h2"); h.textContent = part; list.appendChild(h);
    CANDIDATES.filter(function (c) { return c.part === part; }).sort(function (a, b) { return (KEEP[b.id] || 0) - (KEEP[a.id] || 0); }).forEach(function (c) {
      var it = item(c);
      var div = document.createElement("div");
      div.className = "it" + (sel[c.id] ? " on" : "");
      div.innerHTML = '<label class="hd"><input type="checkbox"' + (sel[c.id] ? " checked" : "") + '><span class="id">' + c.id + "</span>" +
        (c.type ? '<span class="tg">' + esc(c.type) + "</span>" : "") + (PREP[c.id] ? '<span class="tg wx">déroulé (E2)</span>' : "") + (HITCH[c.id] ? '<span class="tg wx">pépin (E2)</span>' : "") + (FINALE[c.id] ? '<span class="tg wx">soirée (E1)</span>' : "") + (TAKEN[c.id] ? '<span class="tg">déjà dans ' + TAKEN[c.id] + "</span>" : "") +
        '<span class="tg">' + c.qn + " Q</span></label>" +
        '<details><summary>' + esc(c.excerpt.slice(0, 120)) + "…</summary><div class=\"tx\">" + esc(it.text) + "</div>" +
        it.qs.map(function (q) { return '<div class="q">' + esc(q.q) + " → <b>" + esc(q.a) + "</b></div>"; }).join("") + "</details>";
      div.querySelector("input").addEventListener("change", function (e) { if (e.target.checked) sel[c.id] = 1; else delete sel[c.id]; div.className = "it" + (sel[c.id] ? " on" : ""); out(); });
      list.appendChild(div);
    });
  });
  out();
}
function out() {
  var ids = Object.keys(sel);
  var by = function (p) { return ids.filter(function (i) { return i.indexOf(p) === 0; }); };
  document.getElementById("count").textContent = "Sélection : " + by("p3_").length + " P3 · " + by("p4_").length + " P4 · " + by("p7p").length + " P7";
  document.getElementById("out").value = "P3: " + by("p3_").join(", ") + "\nP4: " + by("p4_").join(", ") + "\nP7: " + by("p7p").join(", ");
}
document.getElementById("copy").addEventListener("click", function () {
  var t = document.getElementById("out"); t.select();
  try { navigator.clipboard.writeText(t.value); } catch (e) { console.warn("[review] copy:", e && e.message); }
});
render();
