// Relecture du vivier « voyage » (sans React : une liste à cocher). Textes lus dans les vraies banques.
import { LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";
import CANDIDATES from "./candidates.json";

// Présélection de Claude : vraiment voyage (aéroport, train, taxi, hôtel, itinéraire) ou bulletin météo.
var KEEP = { p3_92: 1, p3_72: 1, p3_08: 1, p3_34: 1, p3_40: 1, p3_29: 1,
  p4_02: 1, p4_47: 1, p4_97: 1, p4_32: 1, p4_85: 1, p4_63: 1, p4_17: 1, p4_67: 1, p4_84: 1, p4_74: 1,
  p7p66: 1, p7p63: 1, p7p14: 1, p7p75: 1, p7p59: 1, p7p46: 1 };
var WEATHER = { p4_17: 1, p4_67: 1, p4_84: 1, p4_74: 1, p4_02: 1, p4_47: 1 };
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
        (c.type ? '<span class="tg">' + esc(c.type) + "</span>" : "") + (WEATHER[c.id] ? '<span class="tg wx">météo</span>' : "") +
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
